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

from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'yack.views.home', name='home'),
    # url(r'^yack/', include('yack.foo.urls')),
    url(r'^$', 'uploader.views.index'),
    url(r'^yack/command$', 'uploader.views.command'),
    url(r'^file', 'uploader.views.send_file'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
