# -*- coding: utf-8 -*-
"""
 Copyright (c) 2011 Frédéric Bertolus.

 This file is part of Yack.
 Yack is free software: you can redistribute it and/or modify it
 under the terms of the GNU Affero General Public License as published by the
 Free Software Foundation, either version 3 of the License, or (at your
 option) any later version.

 Yack is distributed in the hope that it will be useful, but WITHOUT
 ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for
 more details.
 You should have received a copy of the GNU Affero General Public License along
 with Yack. If not, see http://www.gnu.org/licenses/.
"""
from yack.uploader.models import YackPack, YackUser
from django.core.exceptions import ObjectDoesNotExist

class YackTools:
    
    def parse_pack_path(cls, path): #@NoSelf
        split_path = path.split("/")
        
        if not len(split_path):
            return None
        
        pack = None
        
        try:
            user = YackUser.objects.get(code=split_path[0])
            pack = user.pack
        except ObjectDoesNotExist:
            # the user is not found
            return None
            
        for sub_pack_path in split_path[1:]:
            try:
                pack = YackPack.objects.get(parent_pack=pack, code=sub_pack_path)
                pack = user.pack
            except ObjectDoesNotExist:
                # the sub pack is not founud
                return pack
        
        return pack